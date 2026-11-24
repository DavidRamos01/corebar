package com.corebar.backend.api.dto;

import com.corebar.backend.entity.enums.EstadoMesa;
import jakarta.validation.constraints.NotNull;

public record MesaEstadoRequest(@NotNull EstadoMesa estado) {
}
