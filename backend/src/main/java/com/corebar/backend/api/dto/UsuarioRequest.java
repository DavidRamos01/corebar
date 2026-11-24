package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
		@NotBlank @Size(max = 100) String nombre,
		@NotBlank @Size(max = 50) String username,
		@Size(min = 4, max = 255) String password,
		@NotNull Rol rol,
		Boolean activo) {
}
