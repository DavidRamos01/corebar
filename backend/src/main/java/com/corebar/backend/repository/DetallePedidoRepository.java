package com.corebar.backend.repository;

import com.corebar.backend.entity.DetallePedido;
import com.corebar.backend.entity.enums.EstadoDetallePedido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DetallePedidoRepository extends JpaRepository<DetallePedido, Integer> {

	List<DetallePedido> findByPedido_IdPedido(Integer idPedido);

	List<DetallePedido> findByEstado(EstadoDetallePedido estado);
}
