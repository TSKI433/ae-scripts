// Author:TSKI433
// Respository:https://github.com/TSKI433/ae-scripts
// Version: 1.0
(function (thisObj) {
  // 防止垃圾回收
  var palette, button1, button2;
  var content = "";
  var contentType = "lrc";
  function buildUI(thisObj) {

    palette = thisObj instanceof Panel ? thisObj : new Window("palette");
    palette.text = "LRC或SRT字幕导入";
    palette.orientation = "column";
    palette.alignChildren = ["left", "top"];
    palette.spacing = 10;
    palette.margins = 16;

    var panel1 = palette.add("panel", undefined, undefined, { name: "panel1" });
    panel1.text = "从文本导入";
    panel1.preferredSize.width = 270;
    panel1.orientation = "column";
    panel1.alignChildren = ["left", "top"];
    panel1.spacing = 10;
    panel1.margins = 10;

    var edittext1 = panel1.add(
      'edittext {properties: {name: "edittext1", multiline: true}}'
    );
    edittext1.tooltip = "将歌词或者字幕粘贴到这里";
    edittext1.preferredSize.width = 250;
    edittext1.preferredSize.height = 150;
    edittext1.alignment = ["center", "top"];

    var statictext1 = panel1.add("statictext", undefined, undefined, {
      name: "statictext1",
    });
    statictext1.text = "文本格式";


    var group1 = panel1.add("group", undefined, { name: "group1" });
    group1.orientation = "row";
    group1.alignChildren = ["left", "center"];
    group1.spacing = 10;
    group1.margins = 0;

    var radiobutton1 = group1.add("radiobutton", undefined, undefined, {
      name: "radiobutton1",
    });
    radiobutton1.text = "lrc";
    radiobutton1.value = true;

    var radiobutton2 = group1.add("radiobutton", undefined, undefined, {
      name: "radiobutton2",
    });
    radiobutton2.text = "srt";


    button1 = panel1.add("button", undefined, undefined, {
      name: "button1",
    });
    button1.text = "导入";
    button1.alignment = ["center", "top"];

    var panel2 = palette.add("panel", undefined, undefined, { name: "panel2" });
    panel2.text = "从文件导入";
    panel2.preferredSize.width = 270;
    panel2.orientation = "column";
    panel2.alignChildren = ["left", "top"];
    panel2.spacing = 10;
    panel2.margins = 10;

    button2 = panel2.add("button", undefined, undefined, {
      name: "button2",
    });
    button2.text = "选择srt或lrc文件";
    button2.alignment = ["center", "top"];

    edittext1.onChanging = edittext1.onChange = function () {
      content = edittext1.text;
    };
    // 绑定radio
    radiobutton1.onClick = function () {
      contentType = "lrc";
    };
    radiobutton2.onClick = function () {
      contentType = "srt";
    };
    button1.onClick = function () {
      button1.enabled = false;
      button2.enabled = false;
      process(contentType,content)
      button1.enabled = true;
      button2.enabled = true;
    }
    button2.onClick = function(){
      button1.enabled = false;
      button2.enabled = false;
      loadFromFile()
      button1.enabled = true;
      button2.enabled = true;
    }
    palette.onResizing = palette.onResize = function () {
      this.layout.resize();
    };
    if (palette instanceof Window) {
      palette.center();
      palette.show();
    } else {
      palette.layout.layout(true);
      palette.layout.resize();
    }
  }

  function process(contentType,content) {
    if (contentType == "lrc") {
      var subtitles = processLrc(content);
      if (subtitles.length == 0) {
        alert("没有找到歌词");
        return;
      }
      addSubtitles(subtitles);
    } else if (contentType == "srt") {
      var subtitles = processSrt(content);
      if (subtitles.length == 0) {
        alert("没有找到字幕");
        return;
      }
      addSubtitles(subtitles);
    }
  }

  function processLrc(content) {
    var lines = content.split("\n");
    var lrc = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var result = line.match(/\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/);
      if (result != null) {
        var startTime = parseInt(result[1]) * 60 + Number(result[2]);
        var text = result[3];
        // 如果间隔太短，不调整时间
        if (
          lrc.length !== 0
        ) {
          lrc[lrc.length - 1].endTime = startTime;
        }
        //   默认显示时间为1秒
        lrc.push({ startTime: startTime, endTime: startTime + 1, text: text });
      }
    }
    return lrc;
  }

  function processSrt(content) {
    var lines = content.split("\n");
    var srt = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var result = line.match(
        /(\d{2}):(\d{2}):(\d{2},\d{3,4}) --> (\d{2}):(\d{2}):(\d{2},\d{3,4})/
      );
      if (result != null) {
        var startTime =
          parseInt(result[1]) * 3600 +
          parseInt(result[2]) * 60 +
          Number(result[3].replace(",", "."));
        var endTime =
          parseInt(result[4]) * 3600 +
          parseInt(result[5]) * 60 +
          Number(result[6].replace(",", "."));
        var text = lines[i + 1];
        srt.push({ startTime: startTime, endTime: endTime, text: text });
      }
    }
    return srt;
  }

  function addSubtitles(subtitles) {
    app.beginUndoGroup("Add Subtitles");
    var activeItem = app.project.activeItem;
    if (activeItem == null || !(activeItem instanceof CompItem)) {
      alert("请选中一个合成");
      return;
    }
    var activeComp = activeItem;
    for (var i = 0; i < subtitles.length; i++) {
      var textLayer = activeComp.layers.addText(subtitles[i].text);
      textLayer.startTime = subtitles[i].startTime;
      textLayer.inPoint = subtitles[i].startTime;
      textLayer.outPoint = subtitles[i].endTime;
    }
  }

  function loadFromFile() {
    var myFileDialog = new File();

    // 显示对话框，让用户选择一个文件，要求文件扩展名为srt或者lrc
    var selectedFile = myFileDialog.openDlg(
      "请选择一个srt文件或lrc文件",
      "srt:*.srt,lrc:*.lrc"
    );

    // 检查用户是否真的选择了一个文件
    if (selectedFile != null) {
      // 检查文件的扩展名
      var fileName = selectedFile.name;
      var extension = fileName.substring(fileName.lastIndexOf(".") + 1);
      var fileContent = "";
      var fileContentType = "";
      switch (extension) {
        case "srt":
          fileContentType = "srt";
          break;
        case "lrc":
          fileContentType = "lrc";
          break;
        default:
          alert("文件扩展名必须为srt或者lrc");
          return;
      }
      selectedFile.open("r");
      fileContent = selectedFile.read();
      selectedFile.close();
      process(fileContentType,fileContent);
    } else {
      // 用户取消了选择
      alert("未选择任何文件");
    }
  }

  buildUI(thisObj);
})(this);
