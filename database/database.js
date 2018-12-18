var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://postgres:warmnightlights@localhost/hs_chat');
module.exports = sequelize;