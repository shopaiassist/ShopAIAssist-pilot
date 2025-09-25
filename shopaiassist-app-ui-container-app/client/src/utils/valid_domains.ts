const valid_domains = [
  '.onesourcetax.com',
  '.example.com',
  '.integrationpoint.net',
  'gtm.main.local',
  'integrationpoint.com',
  'ogt.legacy.web',
  'localhost',
];

/**
 * Process the event origin and prepare it for checking against valid domains.
 */
const prepare_origin = (origin: string) => {
  const domain = new URL(origin);
  const domain_arr = domain.hostname.split('.');
  const len = domain_arr.length;

  // handles localhost
  if (len > 0 && len < 2 && domain_arr[len - 1] === 'localhost') {
    return ['', domain_arr[len - 1]];
  }

  // handles domain & top-level domains
  if (len === 2 && domain_arr[len - 2] !== '' && domain_arr[len - 1] !== '') {
    return ['', `${domain_arr[len - 2] || ''}.${domain_arr[len - 1]}`];
  }

  if (len >= 3 && domain_arr[len - 3] !== '' && domain_arr[len - 2] !== '' && domain_arr[len - 1] !== '') {
    return [domain_arr[len - 3], `.${domain_arr[len - 2]}.${domain_arr[len - 1]}`];
  }
};

/**
 * Do the check against the valid domains list.
 */
const check_domain_is_valid = (subdomain: string, domain: string) => {
  const full_origin = `${subdomain || ''}${domain || ''}`;

  const full_origin_valid: number = full_origin ? valid_domains.findIndex((v) => v.includes(full_origin)) : -1;
  const domain_valid: number = domain ? valid_domains.findIndex((v) => v.includes(domain)) : -1;
  const isLocal: boolean = domain === 'localhost' && subdomain === '';

  return full_origin_valid > -1 || domain_valid > -1 || isLocal;
};

export const do_check = (origin: string) => {
  const prepared_origin = prepare_origin(origin);
  if (!prepared_origin) {
    return false;
  }
  return check_domain_is_valid(prepared_origin[0], prepared_origin[1]);
};
