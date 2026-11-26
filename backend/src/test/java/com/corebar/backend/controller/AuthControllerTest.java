package com.corebar.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.corebar.backend.api.dto.AuthResponse;
import com.corebar.backend.api.dto.LoginRequest;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.Rol;
import com.corebar.backend.repository.UsuarioRepository;
import com.corebar.backend.security.JwtProperties;
import com.corebar.backend.security.JwtService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthControllerTest {

	private UsuarioRepository usuarios;
	private PasswordEncoder encoder;
	private JwtService jwtService;
	private AuthController controller;
	private Usuario cocinero;

	@BeforeEach
	void setUp() {
		usuarios = mock(UsuarioRepository.class);
		encoder = new BCryptPasswordEncoder();
		jwtService = new JwtService(new JwtProperties("clave-de-pruebas-con-mas-de-32-bytes-123456", 3_600_000));
		controller = new AuthController(usuarios, encoder, jwtService);

		cocinero = new Usuario();
		cocinero.setIdUsuario(3);
		cocinero.setNombre("Cocinero Uno");
		cocinero.setUsername("cocinero1");
		cocinero.setPassword(encoder.encode("secreto123"));
		cocinero.setRol(Rol.COCINERO);
		cocinero.setActivo(true);
	}

	@Test
	void loginCorrectoDevuelveTokenYPerfil() {
		when(usuarios.findByUsername("cocinero1")).thenReturn(Optional.of(cocinero));

		AuthResponse respuesta = controller.login(new LoginRequest("cocinero1", "secreto123"));

		assertThat(respuesta.tokenType()).isEqualTo("Bearer");
		assertThat(respuesta.expiresIn()).isEqualTo(3_600);
		assertThat(respuesta.usuario().rol()).isEqualTo(Rol.COCINERO);
		assertThat(jwtService.isValid(respuesta.accessToken())).isTrue();
		assertThat(jwtService.extractUsername(respuesta.accessToken())).isEqualTo("cocinero1");
	}

	@Test
	void loginIgnoraEspaciosAlrededorDelUsuario() {
		when(usuarios.findByUsername("cocinero1")).thenReturn(Optional.of(cocinero));

		AuthResponse respuesta = controller.login(new LoginRequest("  cocinero1  ", "secreto123"));

		assertThat(respuesta.usuario().username()).isEqualTo("cocinero1");
	}

	@Test
	void loginConContrasenaIncorrectaFalla() {
		when(usuarios.findByUsername("cocinero1")).thenReturn(Optional.of(cocinero));

		assertThatThrownBy(() -> controller.login(new LoginRequest("cocinero1", "mala")))
				.isInstanceOf(BadCredentialsException.class);
	}

	@Test
	void loginConUsuarioInexistenteFalla() {
		when(usuarios.findByUsername("nadie")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> controller.login(new LoginRequest("nadie", "secreto123")))
				.isInstanceOf(BadCredentialsException.class);
	}

	@Test
	void loginConUsuarioDesactivadoFalla() {
		cocinero.setActivo(false);
		when(usuarios.findByUsername("cocinero1")).thenReturn(Optional.of(cocinero));

		assertThatThrownBy(() -> controller.login(new LoginRequest("cocinero1", "secreto123")))
				.isInstanceOf(BadCredentialsException.class)
				.hasMessageContaining("desactivado");
	}

	@Test
	void meDevuelve401SinUsuarioAutenticado() {
		assertThat(controller.me(null).getStatusCode().value()).isEqualTo(401);
	}

	@Test
	void meDevuelveElPerfilDelUsuarioAutenticado() {
		when(usuarios.findByUsername("cocinero1")).thenReturn(Optional.of(cocinero));

		var respuesta = controller.me("cocinero1");

		assertThat(respuesta.getBody().idUsuario()).isEqualTo(3);
		assertThat(respuesta.getBody().rol()).isEqualTo(Rol.COCINERO);
	}

	@Test
	void meFallaSiElUsuarioYaNoExiste() {
		when(usuarios.findByUsername("fantasma")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> controller.me("fantasma")).isInstanceOf(ResourceNotFoundException.class);
	}
}
