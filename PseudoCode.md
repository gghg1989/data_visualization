## Quad-tree Algorithm
Students: Yuzhou Feng
### Data Structure
It is assumed these structures are used.
```java
// Simple coordinate object to represent points and vectors
struct XY
  float x
  float y

  function __construct(float _x, float _y) ...

// Axis-aligned bounding box with half dimension and center
struct AABB

  XY center
  float halfDimension

  function __construct(XY center, float halfDimension) ...
  function containsPoint(XY point) ...
  function intersectsAABB(AABB other) ...
```
### QuadTree class
This class represents both one quad tree and the node where it is rooted.
```java
class QuadTree

  // Arbitrary constant to indicate how many elements can be stored in this quad tree node
  constant int QT_NODE_CAPACITY = 4

  // Axis-aligned bounding box stored as a center with half-dimensions
  // to represent the boundaries of this quad tree
  AABB boundary

  // Points in this quad tree node
  Array of XY [size = QT_NODE_CAPACITY] points

  // Children
  QuadTree* northWest
  QuadTree* northEast
  QuadTree* southWest
  QuadTree* southEast

  // Methods
  function __construct(AABB _boundary) ..
  function insert(XY p) ..
  function subdivide() .. // create four children that fully divide this quad into four quads of equal area
  function queryRange(AABB range) ..
```
### Insertion
The following method inserts a point into the appropriate quad of a quadtree, splitting if necessary.
- Input: point(XY)
- Output: insersion success or not(Boolean)
```java
class QuadTree

  ...

  // Insert a point into the QuadTree
  function insert(XY p)
    // Ignore objects that do not belong in this quad tree
    if (!boundary.containsPoint(p))
      return false // object cannot be added

    // If there is space in this quad tree and if doesn't have subdivisions, add the object here
    if (points.size < QT_NODE_CAPACITY && northWest == null)
      points.append(p)
      return true
  
    // Otherwise, subdivide and then add the point to whichever node will accept it
    if (northWest == null)
      subdivide()
    //We have to add the points/data contained into this quad array to the new quads if we want that only 
    //the last node holds the data 

    if (northWest->insert(p)) return true
    if (northEast->insert(p)) return true
    if (southWest->insert(p)) return true
    if (southEast->insert(p)) return true

    // Otherwise, the point cannot be inserted for some unknown reason (this should never happen)
    return false
 
```
### Query range
The following method finds all points contained within a range.
- Input: range(AABB)
- Output: points in range(Array)
```java
class QuadTree
  // Find all points that appear within a range
  function queryRange(AABB range)
  
    // Prepare an array of results
    Array of XY pointsInRange

    // Automatically abort if the range does not intersect this quad
    if (!boundary.intersectsAABB(range))
      return pointsInRange // empty list

    // Check objects at this quad level
    for (int p = 0 p < points.size p++)
      if (range.containsPoint(points[p]))
        pointsInRange.append(points[p])

    // Terminate here, if there are no children
    if (northWest == null)
      return pointsInRange

    // Otherwise, add the points from the children
    pointsInRange.appendArray(northWest->queryRange(range))
    pointsInRange.appendArray(northEast->queryRange(range))
    pointsInRange.appendArray(southWest->queryRange(range))
    pointsInRange.appendArray(southEast->queryRange(range))

    return pointsInRange
 
```

## Database CRUD Algorithm
Students: Jingwei Li

### Create entry to database
- Input: data subject(Map)
- Output: insersion success or not(Boolean)
- data structure: List

```java
function add(Subject subject)
    boolean flag = false
    String sql="insert"
    PreparedStatement pstmt = conn.prepareStatement(sql)
    int i = executeUpdateNumber
    if(i>0)
      flag = true
    return flag
``` 
 
### Query All data
- Input: N/A
- Output: List
- data structure: List

```java
  function selectall() 
    List<Subject> list = new ArrayList<Subject>()
    String sql = "select * from tb_subject"
    PreparedStatement pstmt = conn.prepareStatement(sql)
    ResultSet rs = pstmt.executeQuery()
    loop (rs.next())
      list.add(subject)
    return list
 
``` 
  
### Query data by ID
- Input: String subjectID
- Output: List
- data structure: List


```java
  function selectByID(String subjectID) 
    List<Subject> list = new ArrayList<Subject>()
      String sql = "select * where subjectID=?"
      loop rs.next() 
        list.add(subject)
      rs.close()
      pstmt.close()
      conn.close()
    return list
```
### Update data
- Input:  String subject
- Output: True/False
- data structure: N/A


```java
  function update( String subject) 
      boolean flag = false
    
      String sql = "update tb_subject"
      int i = executeUpdate()
      if(i>0)flag = true
    return flag
``` 
 
### Delete the data by ID
- Input: subjectID
- Output: True/False
- data structure: N/A

```java
  function delete(int subjectID) 
      boolean flag = false
      String sql = "delete from tb_subject where subjectID = ?"
      PreparedStatement pstmt = conn.prepareStatement(sql)
      int i = pstmt.executeUpdate()
      if(i>0) 
        flag = true
      else
        flag = false
    return flag
```

## RESTful Web Services Algorithm
Student: Boxian Mu<br/>

A web service is a collection of open protocols and standards used for exchanging data between applications or systems. Software applications written in various programming languages and running on various platforms can use web services to exchange data over computer networks like the Internet in a manner similar to inter-process communication on a single computer. This interoperability is due to the use of open standards.

### GET
This is used to provide a read only access to a resource.
- Input: request(JSON)
- Output: resource(JSON String)
- Data Structure: JSON

```Javascript
function get(req)
   res = fs.readFile(req.file)
   data = JSON.parse(res.data)
   return JSON.stringify(data)
```
### PUT
This is used to create a new resource.
- Input: request(JSON)
- Output: add success or not(Boolean)
- Data Structure: JSON

```Javascript
function put(req)
   res = fs.readFile(req.file)
   add(res, req.data)
   return Ture
```
### DELETE
This is used to remove a resource.
- Input: request(JSON)
- Output: delete success or not(Boolean)
- Data Structure: JSON

```Javascript
function delete(req)
   deletedData = 0
   res = fs.readFile(req.file)
   loop
    remove(res, req.data)
   if deletedData not less than 0
   return True
```

### POST
This is used to update a existing resource or create a new resource.
- Input: request (JSON)
- Output: updated resource data(JSON String)
- Data Structure: JSON

```Javascript
function post(req, res)
   res = fs.readFile(req.file)
   update(res, req.data)
   data = JSON.parse(res)
   return JSON.stringify(data)
```

### File Upload
- Input: files (Array)
- Output: formed data(JSON String)
- Data Structure: JSON, Array

function(req) 
    //an array of files selected
    files = [];
    //the save method
    save (file)
      //This method will allow us to change how the data is sent up to the server
      transformRequest function () 
          var formData
          //convert
          formData.append("model", angular.toJson(data.model));
          //now add all of the assigned files
          for i = 0 to data.files
              //add each file to the form data and iteratively name them
              formData.append("file" + i, data.files[i]);
          return formData;