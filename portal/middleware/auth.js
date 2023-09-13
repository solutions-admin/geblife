module.exports = async (req, res, next) => {
    console.log("Need to login with your credentials ..")
  
    if (req.session && req.session.user === "admin" && req.session.admin) {
       next()
    } else {
      req.session.msg = "Redirected to login page; provide credentials to gain access to page";
      res.redirect("/login"); //Send response
      console.log(req.session.msg)
      return;
    }

}