# easy-fetch
<strong> TypeScript node-fetch wrapper with chainable functions.

# Examples:
```ts
import { Request: { get, post } } from 'easy-fetch';

get('https://google.com')
    .then(res => console.log(res.body))
    .catch(console.error)

post('https://google.com')
    .set('Authorization', 'Token')
    .send({ data: 'important data' })
    .query('site' , '1')
    .then(res => console.log(res.body))
    .catch(console.error)
```
JavaScript
```js
const { Request: { get, post } } = require("easy-fetch");

get('https://google.com')
	.then(res => console.log(res.body))
	.catch(console.error)

post('https://google.com')
	.set('Authorization', 'Token')
	.send({ data: 'important data'})
	.query('site', '1')
	.then(res => console.log(res.body))
	.catch(console.error)
