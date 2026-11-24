package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoPedido;
import jakarta.validation.constraints.NotNull;

public record PedidoEstadoRequest(@NotNull EstadoPedido estado) {
}
