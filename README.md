# jsPdf-Dynamo

jsPdf-Dynamo is a wrapper around the open-source JavaScript PDF generation library, jsPDF. Using a
template driven approach, it enables the separation of layout and formatting logic from the placement of
data.

jsPdf-Dynamo can be used with browser or NodeJs applications written in JavaScript or TypeScript.

Advantages of using jsPdf-Dynamo include:

- The separation of layout and formatting logic from the placement of data. As a page is filled with data, jsPdf-Dynamo can insert new pages, with appropriate headings, footings, and bookmarks as required.
- The ability to store corporate and application wide format settings in templates that can be maintained independently from the application. This is similar to
  the use of style sheets in web applications to enable visual consistency, reduce errors and minimise maintenance costs. These format settings can include colours, font styles and sizes, page headings, and more.

## Install

Using npm:

```sh
npm install jspdf --save
```

Using yarn:

```
yarn add jspdf
```

## Basic Concepts

There are a few basic concepts to be aware of when using jsPdf-Dynamo:

- The functionality of jsPdf-Dynamo is implemented through the JsPdfDynamo class.
- The initial page size, orientation and unit of measure are set when the JsPdfDynamo instance is instantiated.
- Output is driven by a series of plain text 'commands'. These commands can be provided as a list of strings from multiple sources, including the JavaScript or TypeScript application, or loaded from 'templates' retrieved from a URL (browser only) or from local text files (NodeJs only).
- Positions are specified relative to the left and top margin. The exception to this are margins which are measured from the appropriate edge of the page.
- All measurements and positions are in the unit of measure specified when the instance
  of JsPdfDynamo is created. This can be millimeters, inches, or points. The exception to this are fonts, which are always specified in points.
- A series of commands can be grouped and named. These groups of commands can then
  be processed one or more times. This is a similar concept to methods or procedures
  in more sophisticated computer languages.
- All commands, command group names and variable names are case insensitive.
- There are two kinds of variables, user variables and system maintained variables. User variables can be created and modified as required using script commands. As the name implies, system maintained variables are created and maintained and cannot be directly modified directly by script commands.

All commands are described in the documentation that can be found [here](./documentation/Documentation.pdf)

## A Simple Example

In this example, there is a single template file, **`template.txt`**

```
[Initialise]
.SetVar themeColour blue
.SetFontName helvetica
.SetSpaceVert = 0.3
.SetMargin a 10
.SetMargin b 15
[End]

[TitlePage]
.SetLineWidth 0.8
.SetLineColor %themeColour%
.DrawBox  0 0 %_PageWidth% %_PageHeight% 0
.SetFontSize 36
.SetTextColour %themeColour%
.SetFontStyle Bold
.DrawTextBox 0 0 %_PageWidth% %_PageHeight% center center %title%
[End]

[DrawPage]
.Do Initialise TitlePage
[End]
```

The code to load this template, set the text of the title, process the commands, and save the document is:

```TypeScript
import { JsPdfDynamo } from "jspdf-dynamo";

const commands = [
    // Load the template
    ".include path-to-template/template.txt",
    // Set the title
    ".SetVar title This is a title",
    // Process the template
    ".Do DrawPage",
    // Save the pdf
    ".SavePdf ./simple.pdf"
];
await pdfDynamo.processCommands(commands);
```

This, example can be found in the examples folder (additional examples to be added).
