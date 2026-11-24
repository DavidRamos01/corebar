package com.corebar.backend.entity;

import com.corebar.backend.entity.enums.EstadoDetallePedido;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Detalle_Pedido")
@Getter
@Setter
@NoArgsConstructor
public class DetallePedido {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_detalle")
	private Integer idDetalle;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_pedido", nullable = false)
	private Pedido pedido;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_producto", nullable = false)
	private Producto producto;

	@Column
	private Integer cantidad = 1;

	@Column(length = 255)
	private String notas;

	@Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
	private BigDecimal precioUnitario;

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "ENUM('RECIBIDO','PREPARACION','LISTO','SERVIDO')")
	private EstadoDetallePedido estado = EstadoDetallePedido.RECIBIDO;
}
