import { serialize } from "cookie";
/**
 * This sets `cookie` on `res` object
 * name -> "viewer"
 * value -> "userId"
 * options -> age, httpOnly, etc...
 */
const cookie = (res, name, value, options = {}) => {
  const stringValue =
    typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);

  if ("maxAge" in options) {
    options.expires = new Date(Date.now() + options.maxAge);
    options.maxAge /= 1000;
  }

  res.setHeader("Set-Cookie", serialize(name, String(stringValue), options));
};

const clearCookie = (res, name) => {
  res.setHeader("Set-Cookie", `${name}=; max-age=0`);
};

/**
 * Adds `cookie` fn on the response object.
 */
const cookies = (handler) => (req, res) => {
  /*
    We wrap in a closure(partial application) so that we can merge the res with the name,value, options args
    that are passed when cookie(name,value,options) is called.
  */
  res.cookie = (name, value, options) => cookie(res, name, value, options);
  res.clearCookie = (name) => clearCookie(name);

  return handler(req, res);
};

export default cookies;
