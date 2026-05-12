package com.profeco.busqueda;

import com.profeco.busqueda.grpc.*;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import java.util.List;

// Implementacion del servicio gRPC definido en busqueda.proto
// Quarkus genera las clases base (BusquedaService, BusquedaRequest, etc.)
// a partir del archivo .proto al compilar
@GrpcService
public class BusquedaGrpcService implements BusquedaService {

    @Inject
    BusquedaLogic busquedaLogic;

    // Implementacion del metodo BuscarPrecios definido en el .proto
    // Recibe nombre de producto, devuelve lista de precios ordenados
    @Override
    public Uni<BusquedaResponse> buscarPrecios(BusquedaRequest request) {
        return Uni.createFrom().item(() -> {
            System.out.println("[ms-busqueda gRPC] BuscarPrecios: " + request.getNombreProducto());

            List<Dtos.ResultadoBusquedaDTO> resultados =
                busquedaLogic.buscarPorNombre(request.getNombreProducto());

            return construirResponse(resultados,
                "Se encontraron " + resultados.size() + " precios para: "
                + request.getNombreProducto());
        });
    }

    // Implementacion del metodo CompararPorId definido en el .proto
    // Recibe ID de producto, devuelve comparacion entre todas las tiendas
    @Override
    public Uni<BusquedaResponse> compararPorId(CompararRequest request) {
        return Uni.createFrom().item(() -> {
            System.out.println("[ms-busqueda gRPC] CompararPorId: " + request.getProductoId());

            List<Dtos.ResultadoBusquedaDTO> resultados =
                busquedaLogic.compararPorId(request.getProductoId());

            return construirResponse(resultados,
                "Comparacion de precios para producto ID: " + request.getProductoId());
        });
    }

    // Convierte los DTOs internos al formato de respuesta gRPC
    private BusquedaResponse construirResponse(
            List<Dtos.ResultadoBusquedaDTO> resultados, String mensaje) {

        BusquedaResponse.Builder response = BusquedaResponse.newBuilder()
                .setTotal(resultados.size())
                .setMensaje(mensaje);

        for (Dtos.ResultadoBusquedaDTO r : resultados) {
            ResultadoPrecio resultado = ResultadoPrecio.newBuilder()
                    .setProductoId(r.productoId)
                    .setNombreProducto(r.nombreProducto)
                    .setTiendaId(r.tiendaId)
                    .setNombreTienda(r.nombreTienda)
                    .setTipoTienda(r.tipoTienda)
                    .setPrecio(r.precio)
                    .setEsOferta(r.esOferta)
                    .build();
            response.addResultados(resultado);
        }

        return response.build();
    }
}
