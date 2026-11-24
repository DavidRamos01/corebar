package com.corebar.backend.repository;

import com.corebar.backend.entity.Pedido;
import com.corebar.backend.entity.enums.EstadoPedido;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

	@EntityGraph("Pedido.conDetalles")
	@Override
	Optional<Pedido> findById(Integer id);

	List<Pedido> findByMesa_IdMesa(Integer idMesa);

	List<Pedido> findByMesa_IdMesaAndEstado(Integer idMesa, EstadoPedido estado);

	List<Pedido> findByUsuario_IdUsuario(Integer idUsuario);

	List<Pedido> findByEstado(EstadoPedido estado);

	Optional<Pedido> findFirstByMesa_IdMesaAndEstadoOrderByIdPedidoDesc(Integer idMesa, EstadoPedido estado);

	@EntityGraph("Pedido.conDetalles")
	List<Pedido> findByUsuario_IdUsuarioAndEstado(Integer idUsuario, EstadoPedido estado);
}
