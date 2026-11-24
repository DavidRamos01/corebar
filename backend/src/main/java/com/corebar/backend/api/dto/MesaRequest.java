package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoMesa;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record MesaRequest(
		@NotNull @Positive Integer numero,
		@NotNull @Positive Integer capacidad,
		EstadoMesa estado,
		BigDecimal posX,
		BigDecimal posY) {
}
