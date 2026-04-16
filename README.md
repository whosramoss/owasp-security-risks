<h1>
  <p align="center">
    <img src="./web/src/assets/icon.svg" alt="RASVS logo" width="128">
     <br>OWASP Security Risks
  </p>
</h1>

<p align="center">
  This project demonstrates the OWASP Top 10 API security risks, with vulnerable and secure implementations in each folder.
  <br /> <br />
   <a href="#security-risks">Security Risks</a>
    ·
    <a href="#links">Links</a>
</p>
 
## Security Risks

 The `app.js` file aggregates secure principles for REST APIs, while [GUIDE.md](./GUIDE.md) provides a manual testing guide for the endpoints.

 
| #        | Risk                                            | Folder                                                                                                    |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [API-1]  | Broken Object Level Authorization               | [01-broken-object-level-auth](01-broken-object-level-auth/)                                               |
| [API-2]  | Broken Authentication                           | [02-broken-auth](02-broken-auth/)                                                                         |
| [API-3]  | Broken Object Property Level Authorization      | [03-broken-object-property-level-auth](03-broken-object-property-level-auth/)                             |
| [API-4]  | Unrestricted Resource Consumption               | [04-unrestricted-resource-consumption](04-unrestricted-resource-consumption/)                             |
| [API-5]  | Broken Function Level Authorization             | [05-broken-function-level-auth](05-broken-function-level-auth/)                                           |
| [API-6]  | Unrestricted Access to Sensitive Business Flows | [06-unrestricted-access-to-sensitive-business-flows](06-unrestricted-access-to-sensitive-business-flows/) |
| [API-7]  | Server Side Request Forgery                     | [07-server-side-request-forgery](07-server-side-request-forgery/)                                         |
| [API-8]  | Security Misconfiguration                       | [08-security-misconfiguration](08-security-misconfiguration/)                                             |
| [API-9]  | Improper Inventory Management                   | [09-improper-inventory-management](09-improper-inventory-management/)                                     |
| [API-10] | Unsafe Consumption of APIs                      | [10-unsafe-consumption-of-apis](10-unsafe-consumption-of-apis/)                                           |

Each folder contains:

- `unsecured.js` — vulnerable implementation demonstrating the risk
- `secured.js` — secure implementation with mitigations applied
- `readme.md` — explanation of the vulnerability, fix and how to test it

## Links

- [Official OWASP Top 10 API Security Risk Page](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

## License

Apache-2.0 license. [LICENSE](./LICENSE)

## Author

Gabriel Ramos de Paula ([@whosramoss](https://github.com/whosramoss))
