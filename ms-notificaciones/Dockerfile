# ─── Stage 1: build con Maven ──────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace

# Copia el pom y descarga dependencias primero (capa cacheada)
COPY pom.xml .
RUN mvn -B dependency:go-offline -DskipTests || true

# Copia el código y compila el fast-jar
COPY src ./src
RUN mvn -B package -DskipTests

# ─── Stage 2: runtime ligero ───────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /deployments

COPY --from=build /workspace/target/quarkus-app/lib/      ./lib/
COPY --from=build /workspace/target/quarkus-app/*.jar     ./
COPY --from=build /workspace/target/quarkus-app/app/      ./app/
COPY --from=build /workspace/target/quarkus-app/quarkus/  ./quarkus/

ENV QUARKUS_HTTP_HOST=0.0.0.0

ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
