package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.Rol;

public record UsuarioResponse(
		Integer idUsuario,
		String nombre,
		String username,
		Rol rol,
		Boolean activo) {
}
