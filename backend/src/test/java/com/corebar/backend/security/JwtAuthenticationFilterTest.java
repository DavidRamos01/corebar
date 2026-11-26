package com.corebar.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.Rol;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {

	private JwtService jwtService;
	private JwtAuthenticationFilter filter;
	private String tokenAdmin;

	@BeforeEach
	void setUp() {
		SecurityContextHolder.clearContext();
		jwtService = new JwtService(new JwtProperties("clave-de-pruebas-con-mas-de-32-bytes-123456", 60_000));
		filter = new JwtAuthenticationFilter(jwtService);
		Usuario admin = new Usuario();
		admin.setIdUsuario(1);
		admin.setUsername("admin");
		admin.setRol(Rol.ADMIN);
		tokenAdmin = jwtService.generateToken(admin);
	}

	@AfterEach
	void limpiar() {
		SecurityContextHolder.clearContext();
	}

	private void ejecutar(String cabeceraAuthorization) throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest();
		if (cabeceraAuthorization != null) {
			request.addHeader("Authorization", cabeceraAuthorization);
		}
		FilterChain cadena = (req, res) -> { };
		filter.doFilter(request, new MockHttpServletResponse(), cadena);
	}

	@Test
	void autenticaConUnTokenValido() throws Exception {
		ejecutar("Bearer " + tokenAdmin);

		var auth = SecurityContextHolder.getContext().getAuthentication();
		assertThat(auth).isNotNull();
		assertThat(auth.getPrincipal()).isEqualTo("admin");
		assertThat(auth.getAuthorities()).extracting(a -> a.getAuthority()).containsExactly("ROLE_ADMIN");
	}

	@Test
	void noAutenticaSinCabecera() throws Exception {
		ejecutar(null);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}

	@Test
	void noAutenticaConUnTokenInvalido() throws Exception {
		ejecutar("Bearer token-falso");

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}

	@Test
	void ignoraCabecerasQueNoSonBearer() throws Exception {
		ejecutar("Basic " + tokenAdmin);

		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}
}
