package com.corebar.backend.controller;

import com.corebar.backend.api.ApiDtoMapper;
import com.corebar.backend.api.dto.UsuarioRequest;
import com.corebar.backend.api.dto.UsuarioResponse;
import com.corebar.backend.api.error.ResourceNotFoundException;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.repository.UsuarioRepository;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

	private final UsuarioRepository usuarios;
	private final PasswordEncoder passwordEncoder;

	public UsuarioController(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping
	public List<UsuarioResponse> listar() {
		return usuarios.findAll().stream().map(ApiDtoMapper::toResponse).collect(Collectors.toList());
	}

	@GetMapping("/{id}")
	public UsuarioResponse obtener(@PathVariable Integer id) {
		Usuario u = usuarios.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
		return ApiDtoMapper.toResponse(u);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest request) {
		if (request.password() == null || request.password().isBlank()) {
			throw new IllegalArgumentException("La contraseña es obligatoria al crear un usuario");
		}
		if (usuarios.existsByUsername(request.username())) {
			throw new IllegalStateException("Ya existe un usuario con ese nombre de usuario");
		}
		Usuario u = new Usuario();
		aplicar(u, request, true);
		u.setPassword(passwordEncoder.encode(request.password()));
		return ApiDtoMapper.toResponse(usuarios.save(u));
	}

	@PutMapping("/{id}")
	public UsuarioResponse actualizar(@PathVariable Integer id, @Valid @RequestBody UsuarioRequest request) {
		Usuario u = usuarios.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
		usuarios.findByUsername(request.username()).ifPresent(other -> {
			if (!other.getIdUsuario().equals(id)) {
				throw new IllegalStateException("Ya existe otro usuario con ese nombre de usuario");
			}
		});
		aplicar(u, request, false);
		if (request.password() != null && !request.password().isBlank()) {
			u.setPassword(passwordEncoder.encode(request.password()));
		}
		return ApiDtoMapper.toResponse(usuarios.save(u));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void eliminar(@PathVariable Integer id) {
		if (!usuarios.existsById(id)) {
			throw new ResourceNotFoundException("Usuario no encontrado: " + id);
		}
		usuarios.deleteById(id);
	}

	private static void aplicar(Usuario u, UsuarioRequest request, boolean crear) {
		u.setNombre(request.nombre());
		u.setUsername(request.username());
		u.setRol(request.rol());
		u.setActivo(request.activo() != null ? request.activo() : Boolean.TRUE);
	}
}
