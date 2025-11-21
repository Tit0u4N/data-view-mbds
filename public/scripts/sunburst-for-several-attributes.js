export default async (data) => {

    // Define dimension and SVG container
    const margin = { top: 50, right: 150, bottom: 100, left: 150 };
    const width = 1250 - margin.left - margin.right;

    const processedData = data.map(d => {
        const date = new Date(d.dateGlobal);
        const year = isNaN(date) ? null : date.getFullYear();
        const category = d.category;
        const isFree = d.isFree;
        const type = d.type;
        const os = d.supportedOperatingSystems;
        return { year, category, isFree,type, os };
    }).filter(d => d.year !== null && d.isFree !== null && d.type && d.category );



    print("Stop")



}