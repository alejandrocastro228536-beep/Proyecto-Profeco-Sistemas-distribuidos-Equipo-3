package com.profeco.busqueda;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

// Endpoint REST que expone la busqueda al gateway y al cliente HTML
// Internamente usa BusquedaLogic que orquesta las llamadas gRPC-style a ms-productos y ms-tiendas
// URL base: http://localhost:8086/busqueda
@Path("/busqueda")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class BusquedaResource {

    @Inject
    BusquedaLogic busquedaLogic;

    // GET /busqueda?nombre=leche
    // Busca productos por nombre y devuelve precios de menor a mayor
    // Ejemplo: /busqueda?nombre=leche → precios de "Leche entera 1L" en todas las tiendas
    @GET
    public Response buscar(@QueryParam("nombre") String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"Debes enviar el parametro nombre\"}")
                    .build();
        }

        List<Dtos.ResultadoBusquedaDTO> resultados = busquedaLogic.buscarPorNombre(nombre);

        if (resultados.isEmpty()) {
            return Response.ok()
                    .entity("{\"total\": 0, \"mensaje\": \"No se encontraron precios para: "
                            + nombre + "\", \"resultados\": []}")
                    .build();
        }

        return Response.ok(new BusquedaResponseDTO(resultados)).build();
    }

    // GET /busqueda/producto/{id}
    // Compara precios de un producto especifico en todas las tiendas
    // Ejemplo: /busqueda/producto/1 → precios del producto 1 ordenados de menor a mayor
    @GET
    @Path("/producto/{id}")
    public Response compararPorId(@PathParam("id") Long id) {
        List<Dtos.ResultadoBusquedaDTO> resultados = busquedaLogic.compararPorId(id);

        if (resultados.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"No se encontraron precios para el producto ID: " + id + "\"}")
                    .build();
        }

        return Response.ok(new BusquedaResponseDTO(resultados)).build();
    }

    // DTO de respuesta con total y lista de resultados
    public static class BusquedaResponseDTO {
        public int total;
        public List<Dtos.ResultadoBusquedaDTO> resultados;

        public BusquedaResponseDTO(List<Dtos.ResultadoBusquedaDTO> resultados) {
            this.resultados = resultados;
            this.total = resultados.size();
        }
    }
}
