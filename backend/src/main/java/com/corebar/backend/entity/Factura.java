package com.corebar.backend.entity;

import com.corebar.backend.entity.enums.MetodoPago;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Facturas")
@Getter
@Setter
@NoArgsConstructor
public class Factura {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_factura")
	private Integer idFactura;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_pedido", nullable = false, unique = true)
	private Pedido pedido;

	@Column(name = "fecha_emision")
	private LocalDateTime fechaEmision = LocalDateTime.now();

	@Enumerated(EnumType.STRING)
	@Column(name = "metodo_pago", nullable = false, columnDefinition = "ENUM('EFECTIVO','TARJETA','BIZUM')")
	private MetodoPago metodoPago;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal subtotal;

	@Column(name = "total_iva", nullable = false, precision = 10, scale = 2)
	private BigDecimal totalIva;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal total;
}
