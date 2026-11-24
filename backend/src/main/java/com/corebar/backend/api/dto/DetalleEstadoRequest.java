package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoDetallePedido;
import jakarta.validation.constraints.NotNull;

public record DetalleEstadoRequest(@NotNull EstadoDetallePedido estado) {
}
