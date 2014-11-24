require('app')
  .filter('filterCleanPorts', filterCleanPorts);
/**
 * Ports are an
 *
 * "ports" : {
      "3306/tcp" : [
          {
            "HostIp" : "0.0.0.0",
            "HostPort" : "49257"
          }
      ]
 */
function filterCleanPorts() {
  return function (portValue) {
    return portValue.substring(0, portValue.indexOf('/'));
  };
}
