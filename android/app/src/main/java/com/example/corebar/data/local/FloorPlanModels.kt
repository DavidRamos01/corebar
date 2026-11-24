package com.example.corebar.data.local

/** Posiciones en el mismo espacio que el lienzo del mapa (dp lógicos). */
data class FloorPlanSnapshot(
    val mesas: List<PlacedMesaPersisted> = emptyList(),
    /** Tamaño del salón en dp (recuadro del plano). Null -> valores por defecto. */
    val salonWidthDp: Float? = null,
    val salonHeightDp: Float? = null,
    /** Referencias del local (null en JSON antiguo -> el ViewModel aplica defaults). */
    val entradaX: Float? = null,
    val entradaY: Float? = null,
    val barraX: Float? = null,
    val barraY: Float? = null,
    /** Tamaño zona barra (dp). */
    val barraWidthDp: Float? = null,
    val barraHeightDp: Float? = null,
)

data class PlacedMesaPersisted(
    val idMesa: Int,
    val xDp: Float,
    val yDp: Float,
    /** Si no es null, sustituye la capacidad de la BD solo en el mapa (local). */
    val capacidadOverride: Int? = null,
)
