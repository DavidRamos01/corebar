package com.corebar.backend.api;

import static org.assertj.core.api.Assertions.assertThat;

import com.corebar.backend.api.dto.PedidoResponse;
import com.corebar.backend.entity.Mesa;
import com.corebar.backend.entity.Pedido;
import com.corebar.backend.entity.Usuario;
import com.corebar.backend.entity.enums.EstadoPedido;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ApiDtoMapperTest {

	private Pedido pedido;

	@BeforeEach
	void setUp() {
		Mesa mesa = new Mesa();
		mesa.setIdMesa(4);
		mesa.setNumero(12);

		Usuario camarero = new Usuario();
		camarero.setIdUsuario(2);
		camarero.setNombre("Camarero Uno");

		pedido = new Pedido();
		pedido.setIdPedido(99);
		pedido.setMesa(mesa);
		pedido.setUsuario(camarero);
		pedido.setEstado(EstadoPedido.ABIERTO);
		pedido.setTotal(new BigDecimal("25.50"));
	}

	@Test
	void mapeaLosDatosBasicosDelPedido() {
		PedidoResponse r = ApiDtoMapper.toResponse(pedido, false);

		assertThat(r.idPedido()).isEqualTo(99);
		assertThat(r.idMesa()).isEqualTo(4);
		assertThat(r.numeroMesa()).isEqualTo(12);
		assertThat(r.nombreUsuario()).isEqualTo("Camarero Uno");
		assertThat(r.estado()).isEqualTo(EstadoPedido.ABIERTO);
		assertThat(r.total()).isEqualByComparingTo("25.50");
	}

	@Test
	void sinFacturaElIdDeFacturaEsNulo() {
		assertThat(ApiDtoMapper.toResponse(pedido, false).idFactura()).isNull();
	}

	@Test
	void noIncluyeDetallesSiNoSePiden() {
		assertThat(ApiDtoMapper.toResponse(pedido, false).detalles()).isEmpty();
	}
}
