# To Do Notes

- Restore GetEnvVar capability for Node or Browser?
- Update documentation;
  - List all page sizes
    - Remove pageOrientation
  - Document system maintained vars:
    - \_FILLCOLOUR
    - \_LINECOLOUR
    - \_TEXTCOLOUR
    - \_FONTNAME (Replaces FontType )
  - GetVar has been renamed to CopyVar, GetVariable to getVar
- Document jsPdfDynamo commands:
  - setTextColour
- Document jsPdfDynamo functions:
  - GetVar
- PosnHoz & PosnVert are now PosnTop and PosnLeft
- Ensure all measurements in current UOM
- Setting colours is now by string name or hex.
  - Update appropriate documentation
- Update SetFontStyle, add setFontName
- Document ability to change UOM
  - Font size is always in points!
- PositionLeft/Top is now PositionX/Y
- DrawTextWrapped
  - If a command group is not specified and wrapped text would extend beyond
    the bottom of the page, then a new page will added.
  - If a command group is specified it should check and handle insufficient
    space to draw the text, otherwise any text that would extend beyond the
    bottom page margin will not be drawn.
- CreatePdfStream is now "toBlob" & toBlobUri
- Mention logger/TsLog
- Validate page height and width values in landscape mode
  - Ensure they change after adding a new page
- Command Groups should normally end with [End]. If not they will be terminated by the next cmd group.
- Check filled boxes!
- .SetLogLevel, .writeLog
- .savePdf is now Node only (not browser)
- Create DumpToText, DumpToPdf commands

## Ideas

- Enable setting variables from objects?
- Update colour handling to allow RGB or CMYK formats.
- DrawGrid:
  - Print scale
- Implement creation of anchors & goto links
- Updates to @types/jsPdf (match to node_modules/jspdf/types/index.d.ts)
  - getLineHeightFactor()
  - setLineHeightFactor()
  - getImageProperties()
  - Some of the types:
    - Outlines
  - Context2d
    - setFillStyle should be fillStyle
    - setStrokeStyle should be strokeStyle
- Add ability to leave command group
- Create .SetVarUpper/Lower to save variable in given case.
- Store variables as either strings or numbers
- DrawTextWrapped isn't handling imbedded newline characters
- Create a .DeletePage command
- Wrap the given logger so that the log level can always be used.
- Re-organise the command documentation into functional sections
  - Text
  - Images
  - Pages and layout
  - Variables
  - Logging
  - etc
