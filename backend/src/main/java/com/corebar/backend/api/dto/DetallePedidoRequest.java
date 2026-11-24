package com.corebar.backend.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record DetallePedidoRequest(
		@NotNull Integer idProducto,
		@NotNull @Positive Integer cantidad,
		String notas,
		BigDecimal precioUnitario) {
}
