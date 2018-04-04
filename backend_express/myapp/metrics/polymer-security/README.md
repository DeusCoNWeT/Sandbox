# Polymer scopes analyzer

Herramienta que permite analizar los scopes usando para ello una extensión de chrome y Selenium para abrir el navegador.
La extensión es empaquetada en tiempo de ejecución, por lo que los cambios en la configuración serán añadidos antes de ejecutar.


## Funcionamiento
```
  Usage: security_analyzer [options] <test_component>

  Security analyzer based on scopes required by any component

  Options:

    -h, --help                output usage information
    -V, --version             output the version number
    -c --config <files_list>  Configuration file in JSON format
```
**Ejemplo**
``` bash
  $: ./security_analyzer bower_components/google-login/demo.html
  $: ./security_analyzer -c config.json
```

## Configuración

### Extensión

La configuración de la extensión permite establecer parametros relacionados con los origienes que vamos a considerar en las peticiones para mandar datos a mixpanel (por ejemplo la página http://localhost;8080). La configuración que permite es la siguiente:

| Campo         | Explicación                                                                                                       |
|---------------|-------------------------------------------------------------------------------------------------------------------|
| urls          | Lista de urls de los proveedores de tokens que se van a analizar                                                  |
| domains       | Lista de urls de los proveedores de tokens que cada uno contiene los scopes que permite y los permisos que otorga |
| origin        | Lista de urls que de las que pueden venir las peticiones de tokens. Se basa en los callbacks de las llamadas      |
| experiment_id | (Autogenerado) Identificador del experimento que se esta llevando a cabo                                          |
| penalization  | (Opcional) Penalización extra que tienen las sobre escrituras. Por defecto 0.5                                    |
| mixpanelToken | (Opcional) Token de mixpanel que se utiliza para mandar los resultados                                        |

***NOTA***
Se utiliza un servidor entre las peticiones para identificar los componentes con un determinado experimento.

```json

{
  "urls": [
    "https://accounts.google.com/*",
    "https://www.facebook.com/*",
    "https://api.pinterest.com/*"
  ],
  "domains":{
    "https://accounts.google.com": {
      "profile": "read",
      "email": "read",
      "openid": "read",
      "https://www.googleapis.com/auth/plus.login": "read",
      "https://www.googleapis.com/auth/plus.me": "read",
      "https://www.googleapis.com/auth/userinfo.email": "read",
      "https://www.googleapis.com/auth/userinfo.profile": "read",
      "https://www.googleapis.com/auth/contacts": "read",
      "https://www.googleapis.com/auth/contacts.readonly": "read",
      "min_reads": 1,
      "min_writes": 0
    },
    "https://www.facebook.com": {
      "public_profile": "read",
      "read_stream": "read",
      "min_reads": 2,
      "min_writes": 0
    },
    "https://api.pinterest.com": {
      "read_public": "read",
      "write_public": "write",
      "read_relationships": "read",
      "write_relationships": "write",
      "min_reads": 2, 
      "min_writes": 0
    }
  },
  "origin": [
    "http://localhost:8000",
    "https://centauro.ls.fi.upm.es"
  ],
  "experiment_id": 1497436704983,
  "penalization": 0.5
}
```

### Programa

El programa permite como entrada un fichero json, usando la configuracion `-c` o `--config`.  Permite como entrada los siguientes campos:

| Campo   | Explicación                                                                            |
|---------|----------------------------------------------------------------------------------------|
| files   | Lista de ficheros que van a ser analizados. Permite un string                          |
| timeout | Tiempo (en ms) que se va a esperar a que se ejecute el componente. Por defecto: 5000ms |
| host    | Directorio en el que se va a levantar el servidor                                      |

**Ejemplo**
```json
{
  "files":[
    "bower_components/google-login/demo.html",
    "bower_components/login-facebook/demo.html"
  ],
  "host":"polymer-security",
  "timeout":5000
}
```
