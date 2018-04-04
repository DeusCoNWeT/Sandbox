# POLYMER ACCESSIBILITY TOOL

Web component accessibility evaluation tool. It use
[accessibility-developer-tools](https://github.com/GoogleChrome/accessibility-developer-tools)
and [HTML_CodeSniffer](https://github.com/squizlabs/HTML_CodeSniffer).

## USAGE
```pre
  Usage: acc [options] <test_file>

  Accesibility test for web components. It use WCAG2 and A11Y

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -p --port <port>             Server port. Default 8080
    -t --timeout <timeout>       Waiting time before execute
    -r --root <dir>              Directory root for the server
    -h --host <host>             Host direction. Default localhost
    -o --output <file>           Output file
    --https                      Use HTTPS instance of HTTP
    --config <conf_file>         Configuration file
    --skip                       Does not print result on console
    --brief                      Brief report
    --viewport                   View port size
    --log <level>                Output message level
    --wcag2 <wcag2_level>        WCAG2 level: A AA or AAA
    -l --list <list_components>  List of index
    --skip_errors                Skip console errors
    --nomixpanel                 No send data to mixpanel
    --token                      Mixpanel token

```
## Config file optios

| Parametro        | Descripcion                               | Default   |
|:----------------:|-------------------------------------------|:---------:|
| *port*           | Server port                               | 8080      |
| *timeout*        | Delay before to execute test              | 0         |
| *root*           | Root folder where server will be deployed | .         |
| *host*           | Server host                               | localhost |
| *output*         | Output file where results will be stored  |           |
| *verbose*        | Show all the output information           | true      |
| *brief*          | Only display test results                 | false     |
| *wcag2*          | Enable/disable wcag2 test                 | true      |
| *wcag2_level*    | Set wcag2 test level (A, AA or AAA)       | AAA       |
| *a11y*           | Enable/disable a11y test                  | true      |
| *skip_errors*    | HTML errors will not displayed            | false     |
| *log*            | Set log level (error,info, debug)         | info      |
| *components*     | List of components that will be  tested   |           |
| *mixpanel_token* | Send data to mixpanel using this token    |           |
| *nomixpanel*     | Avoid send data to mixpanel               | false     |
| *id*             | Identifier of experiment                  | timestamp |

### Example of config file

```json
{
  "port": 8081,
  "timeout": 3000,
  "output": "resultado.json",
  "verbose": false,
  "skip_errors":true,
  "wcag2":false,
  "a11y":true,
  "brief":true,
  "nomixpanel":true,
  "log":"DEBUG",
  "components": [
    "traffic-incidents-stable/demo/index.html"
  ],
  "root":"bower_components",
  "mixpanel_token":"5545dfs25482dhwh324s"
}
```

### Mapping element
A11y and WCAG have similar norms. This file set the equivalences between A11Y and WCAG in order to avoid count the same error twice.

```
{
  "AX_ARIA_01": "",
  "AX_ARIA_02": "",
  "AX_ARIA_03": "",
  "AX_ARIA_04": "",
  "AX_ARIA_05": "",
  "AX_ARIA_06": "",
  "AX_ARIA_07": "",
  "AX_ARIA_08": "",
  "AX_ARIA_09": "",
  "AX_ARIA_10": "",
  "AX_ARIA_11": "",
  "AX_ARIA_12": "",
  "AX_ARIA_13": "",
  "AX_AUDIO_01": "1_4_2",
  "AX_HTML_01": "3_1_1",
  "AX_HTML_02": "4_1_1",
  "AX_TEXT_01": "1_3_1",
  "AX_TEXT_02": "H30",
  "AX_TEXT_03": "",
  "AX_TEXT_04": "2_4_4",
  "AX_TITLE_01": "2_4_2",
  "AX_IMAGE_01": "1_1_1",
  "AX_FOCUS_01": "2_4_7",
  "AX_FOCUS_02": "",
  "AX_FOCUS_03": "",
  "AX_COLOR_01": "1_4_3",
  "AX_VIDEO_01": "1_2_1",
  "AX_TABLE_01": "1_3_1",
  "AX_TOOLTIP_01": ""
}
```
