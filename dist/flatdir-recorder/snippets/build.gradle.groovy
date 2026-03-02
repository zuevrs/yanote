// Gradle (Groovy DSL) snippet for a target Spring Boot service.
//
// Put yanote JARs into: libs/yanote/*.jar

repositories {
  flatDir { dirs 'libs/yanote' }
}

dependencies {
  implementation fileTree(dir: 'libs/yanote', include: ['*.jar'])
}

