package com.corebar.backend.api.dto;

import jakarta.validation.constraints.NotNull;

public record PedidoCreateRequest(
		@NotNull Integer idMesa,
		@NotNull Integer idUsuario) {
}
