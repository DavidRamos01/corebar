package com.corebar.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.Rol;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

	private static final String SECRET = "clave-de-pruebas-con-mas-de-32-bytes-123456";

	private JwtService jwtService;
	private Usuario camarero;

	@BeforeEach
	void setUp() {
		jwtService = new JwtService(new JwtProperties(SECRET, 60_000));
		camarero = new Usuario();
		camarero.setIdUsuario(7);
		camarero.setUsername("camarero1");
		camarero.setRol(Rol.CAMARERO);
	}

	@Test
	void generaUnTokenValidoConLosDatosDelUsuario() {
		String token = jwtService.generateToken(camarero);

		assertThat(jwtService.isValid(token)).isTrue();
		assertThat(jwtService.extractUsername(token)).isEqualTo("camarero1");
		assertThat(jwtService.extractIdUsuario(token)).isEqualTo(7);
		assertThat(jwtService.extractRol(token)).isEqualTo(Rol.CAMARERO);
	}

	@Test
	void convierteElRolEnAutoridadConPrefijoRole() {
		String token = jwtService.generateToken(camarero);

		assertThat(jwtService.extractAuthorities(token))
				.extracting(a -> a.getAuthority())
				.containsExactly("ROLE_CAMARERO");
	}

	@Test
	void rechazaUnTokenManipulado() {
		String token = jwtService.generateToken(camarero);
		String manipulado = token.substring(0, token.length() - 2) + "xx";

		assertThat(jwtService.isValid(manipulado)).isFalse();
	}

	@Test
	void rechazaUnTokenFirmadoConOtraClave() {
		JwtService otro = new JwtService(new JwtProperties("otra-clave-distinta-de-mas-de-32-bytes-999", 60_000));
		String tokenAjeno = otro.generateToken(camarero);

		assertThat(jwtService.isValid(tokenAjeno)).isFalse();
	}

	@Test
	void rechazaUnTokenCaducado() {
		JwtService caducado = new JwtService(new JwtProperties(SECRET, -1_000));
		String token = caducado.generateToken(camarero);

		assertThat(jwtService.isValid(token)).isFalse();
	}

	@Test
	void rechazaTextoQueNoEsUnToken() {
		assertThat(jwtService.isValid("esto-no-es-un-jwt")).isFalse();
	}

	@Test
	void noPermiteUnaClaveDemasiadoCorta() {
		assertThatThrownBy(() -> new JwtService(new JwtProperties("corta", 60_000)))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("32 bytes");
	}

	@Test
	void exponeLaDuracionConfigurada() {
		assertThat(jwtService.getExpirationMs()).isEqualTo(60_000);
	}
}
