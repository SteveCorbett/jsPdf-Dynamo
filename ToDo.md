# To Do Notes

- Restore GetEnvVar capability for Node or Browser?
- Document jsPdfDynamo commands:
  - SetLogLevel, SetSpaceHoz, SetSpaceVert
- Document ability to change UOM?
- Mention logger/TsLog
- Validate page height and width values in landscape mode
  - Ensure they change after adding a new page
- Command Groups should normally end with [End]. If not they will be terminated by the next cmd group.
- Check filled boxes!

- .savePdf is now Node only (not browser)
- Create DumpToText, DumpToPdf commands
- Add some more examples:
  - Police report?
- Document how to troubleshoot
  - Setting debug levels on or off

## Ideas

- Enable setting variables from objects?
- Update colour handling to allow RGB or CMYK formats.
- DrawGrid:
  - Print scale numbers
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
- Create a .DeletePage command
- Enable loading custom fonts
- Re-organise the command and system variables documentation into functional sections
  - Text
  - Images
  - Pages and layout
  - Variables
  - Logging
  - etc
- Changes have been made in jsPDF to justify Unicode fonts. See if we can now enable justified textBox
- Expose the current package version as a property of JsPdfDynamo and as a system maintained variable.
