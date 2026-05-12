// NodeGoat-shaped data-access object with SQL concat (test case).
'use strict';

function searchAllocations(db, userId, callback) {
  // VULNERABLE: string concat in SQL context.
  db.query("SELECT * FROM allocations WHERE userId = " + userId, function (err, rows) {
    callback(err, rows);
  });
}

module.exports = { searchAllocations: searchAllocations };
