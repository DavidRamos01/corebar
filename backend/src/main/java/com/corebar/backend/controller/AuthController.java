package com.corebar.backend.controller;

import com.corebar.backend.api.dto.AuthResponse;
import com.corebar.backend.api.dto.LoginRequest;
import com.corebar.backend.api.dto.UsuarioAuthResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.repository.UsuarioRepository;
import com.corebar.backend.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UsuarioRepository usuarios;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	public AuthController(UsuarioRepository usuarios, PasswordEncoder passwordEncoder, JwtService jwtService) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
	}

	@Operation(summary = "Iniciar sesión", description = "Devuelve un JWT para enviarlo como Authorization: Bearer &lt;token&gt;")
	@SecurityRequirements
	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		Usuario u = usuarios
				.findByUsername(request.username().trim())
				.orElseThrow(() -> new BadCredentialsException("Usuario o contraseña incorrectos"));
		if (!Boolean.TRUE.equals(u.getActivo())) {
			throw new BadCredentialsException("Usuario desactivado");
		}
		if (!passwordEncoder.matches(request.password(), u.getPassword())) {
			throw new BadCredentialsException("Usuario o contraseña incorrectos");
		}
		String token = jwtService.generateToken(u);
		UsuarioAuthResponse perfil = new UsuarioAuthResponse(
				u.getIdUsuario(),
				u.getNombre(),
				u.getUsername(),
				u.getRol());
		return new AuthResponse(token, "Bearer", jwtService.getExpirationMs() / 1000, perfil);
	}

	@Operation(summary = "Usuario autenticado actual")
	@GetMapping("/me")
	public ResponseEntity<UsuarioAuthResponse> me(@AuthenticationPrincipal String username) {
		if (username == null) {
			return ResponseEntity.status(401).build();
		}
		Usuario u = usuarios
				.findByUsername(username)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
		return ResponseEntity.ok(
				new UsuarioAuthResponse(
						u.getIdUsuario(),
						u.getNombre(),
						u.getUsername(),
						u.getRol()));
	}
}
