package com.corebar.backend.entity;

import com.corebar.backend.entity.enums.EstadoMesa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Mesas")
@Getter
@Setter
@NoArgsConstructor
public class Mesa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_mesa")
	private Integer idMesa;

	@Column(nullable = false, unique = true)
	private Integer numero;

	@Column(nullable = false)
	private Integer capacidad;

	@Enumerated(EnumType.STRING)
	@Column(columnDefinition = "ENUM('LIBRE','OCUPADA')")
	private EstadoMesa estado = EstadoMesa.LIBRE;

	@Column(name = "pos_x", precision = 10, scale = 2)
	private BigDecimal posX = BigDecimal.ZERO.setScale(2);

	@Column(name = "pos_y", precision = 10, scale = 2)
	private BigDecimal posY = BigDecimal.ZERO.setScale(2);

	@OneToMany(mappedBy = "mesa")
	private List<Pedido> pedidos = new ArrayList<>();
}
