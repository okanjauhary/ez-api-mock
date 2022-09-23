type EzHeaderType = {
  code: number;
  timeout: number;
};

const getEzHeader = (headers: any): EzHeaderType => {
  const ezHeader = {
    code: 200,
    timeout: 0,
  };

  if (typeof headers['ez-status-code'] !== 'undefined') {
    ezHeader.code = Number(headers['ez-status-code']);
  }

  if (typeof headers['ez-timeout'] !== 'undefined') {
    ezHeader.timeout = Number(headers['ez-timeout']);
  }

  return ezHeader;
};

export default getEzHeader;
