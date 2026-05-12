package com.profeco.gateway;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.annotations.QuarkusMain;

// Clase main que NetBeans necesita para ejecutar el proyecto
// @QuarkusMain le dice a Quarkus que este es el punto de entrada
@QuarkusMain
public class Main {
    public static void main(String[] args) {
        Quarkus.run(args);
    }
}