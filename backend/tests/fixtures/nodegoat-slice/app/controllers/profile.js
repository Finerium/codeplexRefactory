// NodeGoat-shaped controller with high cyclomatic complexity (test case).
'use strict';

function profileController(req, res) {
  if (req.user) {
    if (req.user.role === 'admin') {
      if (req.query.action) {
        if (req.query.action === 'edit') {
          if (req.body.field) {
            if (req.body.field === 'email') {
              if (req.body.value) {
                if (validateEmail(req.body.value)) {
                  return res.json({ ok: true });
                } else {
                  return res.status(400).json({ error: 'bad email' });
                }
              } else {
                return res.status(400).json({ error: 'missing value' });
              }
            } else if (req.body.field === 'phone') {
              return res.json({ ok: 'phone' });
            } else if (req.body.field === 'address') {
              return res.json({ ok: 'address' });
            } else {
              return res.status(400).json({ error: 'unknown field' });
            }
          } else {
            return res.status(400).json({ error: 'no field' });
          }
        } else if (req.query.action === 'delete') {
          return res.json({ ok: 'deleted' });
        } else {
          return res.status(400).json({ error: 'unknown action' });
        }
      } else {
        return res.json({ profile: req.user });
      }
    } else {
      return res.status(403).json({ error: 'not admin' });
    }
  } else {
    return res.status(401).json({ error: 'unauthenticated' });
  }
}

function validateEmail(s) { return /.+@.+\..+/.test(s); }

module.exports = profileController;
