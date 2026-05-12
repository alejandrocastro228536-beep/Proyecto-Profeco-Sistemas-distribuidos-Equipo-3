package com.profeco.busqueda;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// Logica de negocio del servicio de busqueda
// Orquesta las llamadas a ms-productos y ms-tiendas y construye la comparacion
@ApplicationScoped
public class BusquedaLogic {

    @Inject
    @RestClient
    ProductosInternoClient productosClient;

    @Inject
    @RestClient
    TiendasInternoClient tiendasClient;

    // Busca productos por nombre (busqueda parcial) y devuelve precios ordenados
    public List<Dtos.ResultadoBusquedaDTO> buscarPorNombre(String nombre) {
        List<Dtos.ResultadoBusquedaDTO> resultados = new ArrayList<>();

        // 1. Traer todos los productos de ms-productos
        List<Dtos.ProductoDTO> productos = productosClient.listar();

        // 2. Filtrar los que coincidan con el nombre buscado (insensible a mayusculas)
        for (Dtos.ProductoDTO producto : productos) {
            if (producto.nombre.toLowerCase().contains(nombre.toLowerCase())) {
                // 3. Para cada producto que coincide, traer sus precios
                resultados.addAll(construirResultados(producto));
            }
        }

        // 4. Ordenar de menor a mayor precio
        resultados.sort(Comparator.comparingDouble(r -> r.precio));

        return resultados;
    }

    // Compara precios de un producto especifico por su ID
    public List<Dtos.ResultadoBusquedaDTO> compararPorId(Long productoId) {
        List<Dtos.ProductoDTO> productos = productosClient.listar();

        // Buscar el producto por ID
        Dtos.ProductoDTO producto = productos.stream()
                .filter(p -> p.id.equals(productoId))
                .findFirst()
                .orElse(null);

        if (producto == null) {
            return new ArrayList<>();
        }

        // Construir resultados y ordenar por precio
        List<Dtos.ResultadoBusquedaDTO> resultados = construirResultados(producto);
        resultados.sort(Comparator.comparingDouble(r -> r.precio));
        return resultados;
    }

    // Construye los resultados enriquecidos para un producto:
    // cruza los precios con los datos de cada tienda
    private List<Dtos.ResultadoBusquedaDTO> construirResultados(Dtos.ProductoDTO producto) {
        List<Dtos.ResultadoBusquedaDTO> resultados = new ArrayList<>();

        // Traer todos los precios de este producto
        List<Dtos.PrecioDTO> precios = productosClient.listarPrecios(producto.id);

        for (Dtos.PrecioDTO precio : precios) {
            // Enriquecer con datos de la tienda llamando a ms-tiendas
            try {
                Dtos.TiendaDTO tienda = tiendasClient.obtener(precio.tiendaId);
                resultados.add(new Dtos.ResultadoBusquedaDTO(
                    producto.id,
                    producto.nombre,
                    tienda.id,
                    tienda.nombre,
                    tienda.tipo,
                    precio.precio,
                    precio.esOferta
                ));
            } catch (Exception e) {
                // Si no se encuentra la tienda, igual incluimos el precio
                System.err.println("[ms-busqueda] No se encontro tienda ID: " + precio.tiendaId);
                resultados.add(new Dtos.ResultadoBusquedaDTO(
                    producto.id,
                    producto.nombre,
                    precio.tiendaId,
                    "Tienda " + precio.tiendaId,
                    "DESCONOCIDO",
                    precio.precio,
                    precio.esOferta
                ));
            }
        }

        return resultados;
    }
}
