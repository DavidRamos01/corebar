package com.corebar.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Productos")
@Getter
@Setter
@NoArgsConstructor
public class Producto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_producto")
	private Integer idProducto;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_categoria", nullable = false)
	private Categoria categoria;

	@Column(nullable = false, length = 150)
	private String nombre;

	@Column(columnDefinition = "TEXT")
	private String descripcion;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal precio;

	@Column(name = "stock_actual")
	private Integer stockActual = 0;

	@Column(name = "porcentaje_iva")
	private Integer porcentajeIva = 21;

	@Column(name = "imagen_url", columnDefinition = "TEXT")
	private String imagenUrl;

	@OneToMany(mappedBy = "producto")
	private List<DetallePedido> detallesPedido = new ArrayList<>();
}
