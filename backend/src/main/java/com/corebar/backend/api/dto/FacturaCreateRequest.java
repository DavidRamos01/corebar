package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.MetodoPago;
import jakarta.validation.constraints.NotNull;

public record FacturaCreateRequest(
		@NotNull Integer idPedido,
		@NotNull MetodoPago metodoPago) {
}
