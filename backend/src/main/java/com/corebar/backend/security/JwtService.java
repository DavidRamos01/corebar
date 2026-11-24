package com.corebar.backend.security;

import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.Rol;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	public static final String CLAIM_ID_USUARIO = "idUsuario";
	public static final String CLAIM_ROL = "rol";

	private final JwtProperties properties;
	private final SecretKey signingKey;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		byte[] keyBytes = properties.secret().getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			throw new IllegalStateException("app.jwt.secret debe tener al menos 32 bytes (256 bits) para HS256");
		}
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public String generateToken(Usuario usuario) {
		Date now = new Date();
		Date exp = new Date(now.getTime() + properties.expirationMs());
		return Jwts.builder()
				.subject(usuario.getUsername())
				.claim(CLAIM_ID_USUARIO, usuario.getIdUsuario())
				.claim(CLAIM_ROL, usuario.getRol().name())
				.issuedAt(now)
				.expiration(exp)
				.signWith(signingKey)
				.compact();
	}

	public boolean isValid(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	public String extractUsername(String token) {
		return parseClaims(token).getSubject();
	}

	public Integer extractIdUsuario(String token) {
		return parseClaims(token).get(CLAIM_ID_USUARIO, Integer.class);
	}

	public Rol extractRol(String token) {
		String r = parseClaims(token).get(CLAIM_ROL, String.class);
		return r == null ? null : Rol.valueOf(r);
	}

	public List<org.springframework.security.core.authority.SimpleGrantedAuthority> extractAuthorities(String token) {
		Rol rol = extractRol(token);
		if (rol == null) {
			return List.of();
		}
		return List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + rol.name()));
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public long getExpirationMs() {
		return properties.expirationMs();
	}
}
