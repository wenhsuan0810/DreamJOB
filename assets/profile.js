/* ============ DreamJOB — profile page ============ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  function fill() {
    var p = DJ.loadProfile();
    $("pfCv").value = p.cv || "";
    $("pfRole").value = p.role || "";
    $("pfLevel").value = p.level || "";
    $("pfIndustry").value = p.industry || "";
    $("pfEmail").value = p.email || "";
  }

  $("pfSaveBtn").addEventListener("click", function () {
    DJ.saveProfile({
      cv: $("pfCv").value,
      role: $("pfRole").value.trim(),
      level: $("pfLevel").value,
      industry: $("pfIndustry").value,
      email: $("pfEmail").value.trim()
    });
    $("pfSavedMsg").classList.remove("hidden");
    setTimeout(function () { $("pfSavedMsg").classList.add("hidden"); }, 2000);
  });

  $("pfExportBtn").addEventListener("click", function () {
    var p = DJ.loadProfile();
    var cv = $("pfCv").value || p.cv || "";
    // export search prefs + CV keyword fingerprint only — not the raw CV
    var kw = DJ.topKeywords(cv, 40).map(function (k) { return k.word; });
    var out = {
      email: $("pfEmail").value.trim() || p.email || "",
      searches: [{
        keyword: $("pfRole").value.trim() || p.role || "",
        area: "",            // optional 104 area code, e.g. 6001001000 = Taipei
        jobexp: ""           // optional 104 experience filter: 1,3,5,10,99
      }],
      level: $("pfLevel").value || "",
      industry: $("pfIndustry").value || "",
      cvKeywords: kw
    };
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "profile.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  fill();
})();
