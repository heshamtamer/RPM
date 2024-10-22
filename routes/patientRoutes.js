const express = require("express");
const router = express.Router();
const {getPatients
    ,getPatient
    ,creatPatient
    ,updatePatient
    ,deletePatient
    ,addDeviceToPatient
    ,removeDeviceFromPatient
} = require("../controllers/patientController");
const { validateToken } = require("../middleware/validateTokenHandler");


router.use(validateToken);
router.route("/")
.get(getPatients)
.post(creatPatient);


router.route("/:id")
.get(getPatient)
.put(updatePatient)
.delete(deletePatient);

// Separate route for assigning a device to a patient
router.route("/:id/device")
.post(addDeviceToPatient)
.delete(removeDeviceFromPatient);



module.exports = router;