package com.corebar.backend.entity;

import com.corebar.backend.entity.enums.EstadoPedido;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.NamedSubgraph;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Pedidos")
@NamedEntityGraph(
		name = "Pedido.conDetalles",
		attributeNodes = {
				@NamedAttributeNode("mesa"),
				@NamedAttributeNode("usuario"),
				@NamedAttributeNode("factura"),
				@NamedAttributeNode(value = "detalles", subgraph = "detalle-producto")
		},
		subgraphs = {
				@NamedSubgraph(name = "detalle-producto", attributeNodes = @NamedAttributeNode("producto"))
		})
@Getter
@Setter
@NoArgsConstructor
public class Pedido {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_pedido")
	private Integer idPedido;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_mesa", nullable = false)
	private Mesa mesa;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_usuario", nullable = false)
	private Usuario usuario;

	@Column(name = "fecha_hora")
	private LocalDateTime fechaHora = LocalDateTime.now();

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "ENUM('ABIERTO','PAGADO','CANCELADO')")
	private EstadoPedido estado = EstadoPedido.ABIERTO;

	@Column(precision = 10, scale = 2)
	private BigDecimal total = BigDecimal.ZERO.setScale(2);

	@OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<DetallePedido> detalles = new ArrayList<>();

	@OneToOne(mappedBy = "pedido", fetch = FetchType.LAZY)
	private Factura factura;
}
