const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 5007;

const app = express();

app.use(express.static(path.resolve(__dirname, 'wwwroot')));

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
