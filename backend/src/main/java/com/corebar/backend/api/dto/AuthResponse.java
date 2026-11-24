package com.corebar.backend.api.dto;

public record AuthResponse(
		String accessToken,
		String tokenType,
		long expiresIn,
		UsuarioAuthResponse usuario) {
}
