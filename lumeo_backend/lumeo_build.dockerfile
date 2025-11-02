FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copiar archivos de Maven desde la subcarpeta lumeo
COPY lumeo/pom.xml ./
COPY lumeo/src ./src

# Compilar el proyecto
RUN mvn clean package -DskipTests

# Segunda etapa: imagen de runtime
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copiar el JAR compilado
COPY --from=build /app/target/*.jar app.jar

# Variables de entorno para JVM
ENV JAVA_OPTS="-Xmx450m -Xms256m -XX:+UseContainerSupport"

# Exponer puerto
EXPOSE 8080

# Comando de inicio
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
