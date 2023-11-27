const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@clustermain.vdf6goj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      error: true,
      message: "Need access? send me some money then.... :3",
    });
  }
  const token = authorization.split(" ")[1];
  console.log("split token", token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({
        error: true,
        message: "get error from jwt verify at line 33 backend",
      });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const UserCollection = client.db("agency-portfolio").collection("all-user");

    const photoGraphyCollection = client
      .db("agency-portfolio")
      .collection("photography");

    const recentWorksCollection = client
      .db("agency-portfolio")
      .collection("recent-works");

    const userrecentWorksCollection = client
      .db("agency-portfolio")
      .collection("user-recent-works");

    const userPortfolioCollection = client
      .db("agency-portfolio")
      .collection("userPortfolio");

    const PortfolioCollection = client
      .db("agency-portfolio")
      .collection("portfolio");

    const Memberscollection = client
      .db("agency-portfolio")
      .collection("members");

    const UserMemberscollection = client
      .db("agency-portfolio")
      .collection("userAddMembers");

    const FeaturedImageCollection = client
      .db("agency-portfolio")
      .collection("featuredIamges");

    const CinematographyCollection = client
      .db("agency-portfolio")
      .collection("cinematographyLinks");

    const UserAddSection = client
      .db("agency-portfolio")
      .collection("add-section-user");

    const clientsReviews = client
      .db("agency-portfolio")
      .collection("clients-review");

    const EventsCollection = client.db("agency-portfolio").collection("events");
    const UserEventsCollection = client
      .db("agency-portfolio")
      .collection("userevents");
    const LogoCollection = client.db("agency-portfolio").collection("logos");

    // ---------JWT----------------
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    // ---------JWT----------------
    app.post("/createuser", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existinUser = await UserCollection.findOne(query);
      if (existinUser) {
        return res.send({ message: "user already exits" });
      }
      const result = await UserCollection.insertOne(user);
      // const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
      //   expiresIn: "1h",
      // });
      res.send(result);
    });

    //update user information from dashboar personalizaion
    app.patch("/updateuserInfo/:email", async (req, res) => {
      const email = req.params.email;
      const updatesInfo = req.body;
      const options = { upsert: true };
      const query = { email: email };
      const updateDoc = {
        $set: {
          image: updatesInfo.image,
          name: updatesInfo.name,
        },
      };
      const result = await UserCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.get("/photography", async (req, res) => {
      const AllPhotoGraphys = await photoGraphyCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(AllPhotoGraphys);
    });

    app.get("/getuserinfo/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userInfo = await UserCollection.find(query).toArray();
      res.send(userInfo);
    });

    app.get("/recentworks", async (req, res) => {
      const RecentWorks = await recentWorksCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(RecentWorks);
    });

    app.get("/myportfolio", async (req, res) => {
      const PortfolioImages = await PortfolioCollection.find()
        .sort({ _id: -1 })
        .toArray();
      res.send(PortfolioImages);
    });

    app.get("/ourmembers", async (req, res) => {
      const MembersAll = await Memberscollection.find()
        .sort({ _id: -1 })
        .toArray();
      res.send(MembersAll);
    });

    app.get("/events", async (req, res) => {
      const AllEvents = await EventsCollection.find()
        .sort({ _id: -1 })
        .toArray();
      res.send(AllEvents);
    });

    app.post("/featureimage", async (req, res) => {
      const FeaturedImagesGet = req.body;
      const result = await FeaturedImageCollection.insertOne(FeaturedImagesGet);
      res.send(result);
    });

    app.get("/featuredimage/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userFeaturedImages = await FeaturedImageCollection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userFeaturedImages);
    });

    app.delete("/deleteimage/:imgLink", async (req, res) => {
      const imgLink = req.params.imgLink;

      const query = {
        image: imgLink,
      };

      const update = {
        $pull: {
          image: imgLink,
        },
      };

      try {
        const result = await FeaturedImageCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: "Image deleted successfully" });
        } else {
          res.status(404).json({
            success: false,
            message: "Image not found or failed to delete",
          });
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.post("/logos", async (req, res) => {
      const logo = req.body;
      const result = await LogoCollection.insertOne(logo);
      res.send(result);
    });

    app.get("/getLogos/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const decodedResult = req.decoded;
      console.log(
        "from get logos",
        req.headers.authorization,
        "decoded ressulyyyy",
        decodedResult
      );
      const query = { email: UserEmail };
      const userLogos = await LogoCollection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userLogos);
    });

    app.delete("/deletelogos/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await LogoCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/addservicephoto", async (req, res) => {
      const FeaturedImagesGet = req.body;
      const result = await photoGraphyCollection.insertOne(FeaturedImagesGet);
      res.send(result);
    });

    app.get("/getphotoservice/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userphotoservice = await photoGraphyCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userphotoservice);
    });

    app.delete("/deletephotoservice/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await photoGraphyCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/addcinevideolink", async (req, res) => {
      const CinematoLink = req.body;
      const result = await CinematographyCollection.insertOne(CinematoLink);
      res.send(result);
    });

    app.get("/getcinevideos/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userCineVideo = await CinematographyCollection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userCineVideo);
    });

    app.delete("/deletevideolink/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await CinematographyCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/addrecentworkimages/:email", async (req, res) => {
      const recentworksinfo = req.body;
      // Check if the user exists
      const existingUser = await userrecentWorksCollection.findOne({
        user: recentworksinfo.user,
      });
      if (existingUser) {
        // User exists, update the record
        const updatedUser = await userrecentWorksCollection.updateOne(
          { user: recentworksinfo.user },
          {
            $addToSet: { images: { $each: recentworksinfo.images } },
          }
        );
        res.send(updatedUser);
      } else {
        // User doesn't exist, create a new record
        const newUser = await userrecentWorksCollection.insertOne(
          recentworksinfo
        );

        res.send(newUser);
      }
    });

    app.get("/getrecentworkimages/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { user: UserEmail };
      const userRecentworksimages = await userrecentWorksCollection
        .find(query)
        .toArray();

      // Sort the images array within each document based on the time field
      userRecentworksimages.forEach((doc) => {
        doc.images.sort((a, b) => new Date(b.time) - new Date(a.time));
      });

      res.send(userRecentworksimages);
    });

    app.delete("/deleterecentimage/:imglink", async (req, res) => {
      const recentImgLink = req.params.imglink;
      console.log(recentImgLink);

      // Use $pull to remove the specified image link from the images array
      const query = {
        images: recentImgLink,
      };
      const update = {
        $pull: {
          images: recentImgLink,
        },
      };
      try {
        const result = await userrecentWorksCollection.updateOne(query, update);

        if (result.modifiedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: "Image deleted successfully" });
        } else {
          res.status(404).json({
            success: false,
            message: "Image not found or failed to delete",
          });
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.post("/addportfolio/:email", async (req, res) => {
      const portfolioInfo = req.body;
      const userEmail = req.params.email;

      try {
        const existingUser = await userPortfolioCollection.findOne({
          user: userEmail,
        });

        if (existingUser) {
          const existingCategory = existingUser.portfolio.find(
            (category) => category.categoryName === portfolioInfo.category
          );

          if (existingCategory) {
            // Category exists, update the existing category
            await userPortfolioCollection.updateOne(
              {
                user: userEmail,
                "portfolio.categoryName": portfolioInfo.category,
              },
              {
                $push: {
                  "portfolio.$.images": { $each: portfolioInfo.images },
                },
                $set: { time: portfolioInfo.time },
              }
            );
          } else {
            // Category doesn't exist, create a new category
            await userPortfolioCollection.updateOne(
              { user: userEmail },
              {
                $push: {
                  portfolio: {
                    categoryName: portfolioInfo.category,
                    images: portfolioInfo.images,
                  },
                },
                $set: { time: portfolioInfo.time },
              }
            );
          }
        } else {
          // User doesn't exist, create a new record
          await userPortfolioCollection.insertOne({
            user: userEmail,
            portfolio: [
              {
                categoryName: portfolioInfo.category,
                images: portfolioInfo.images,
              },
            ],
            time: portfolioInfo.time,
          });
        }

        res.status(200).send({ success: true });
      } catch (error) {
        console.error("Error updating or inserting user portfolio:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/getportfolioimages/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { user: UserEmail };
      const userPortfolio = await userPortfolioCollection.find(query).toArray();
      res.send(userPortfolio);
    });

    app.delete("/deleteportfolioimages/:email", async (req, res) => {
      const userEmail = req.params.email;
      const imageToDelete = req.body.image; // Assuming you send the image URL in the request body

      try {
        const result = await userPortfolioCollection.updateOne(
          { user: userEmail },
          {
            $pull: {
              "portfolio.$[category].images": imageToDelete,
            },
          },
          {
            arrayFilters: [
              {
                "category.images": imageToDelete,
              },
            ],
          }
        );

        if (result.modifiedCount > 0) {
          res.status(200).json({ success: true });
        } else {
          res.status(404).json({ error: "Image not found" });
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.post("/addussermemeber", async (req, res) => {
      const userMember = req.body;
      const result = await UserMemberscollection.insertOne(userMember);
      res.send(result);
    });

    app.get("/getmembers/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const usermembers = await UserMemberscollection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(usermembers);
    });

    app.delete("/deletemembers/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await UserMemberscollection.deleteOne(query);
      res.send(result);
    });

    app.post("/addusserevents", async (req, res) => {
      const userEvents = req.body;
      const result = await UserEventsCollection.insertOne(userEvents);
      res.send(result);
    });

    app.get("/getuserevents/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userEventsandDate = await UserEventsCollection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userEventsandDate);
    });

    app.post("/addsection", async (req, res) => {
      const userAddSection = req.body;
      const result = await UserAddSection.insertOne(userAddSection);
      res.send(result);
    });

    app.get("/getusersection/:email", verifyJWT, async (req, res) => {
      const UserEmail = req.params.email;
      const query = { email: UserEmail };
      const userSectionInfo = await UserAddSection.find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(userSectionInfo);
    });

    app.delete("/deletesection/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await UserAddSection.deleteOne(query);
      res.send(result);
    });

    app.get("/clientsreviews", async (req, res) => {
      const clientsReviewsCollection = await clientsReviews
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(clientsReviewsCollection);
    });

    app.post("/adduserreview", async (req, res) => {
      const userreviewsfronclientside = req.body;
      const result = await clientsReviews.insertOne(userreviewsfronclientside);
      res.send(result);
    });

    // -------------------------------------------------
    // -------------------------------------------------
    // -------------------------------------------------

    app.post("/sendemailtouser", async (req, res) => {
      const userInfofromCTA = req.body;
      const user = userInfofromCTA.email;
      const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "adc56ce385e23a",
          pass: "6bfd25beda169a",
        },
      });
      const info = await transporter.sendMail({
        from: '"Agency Portfolio - Chowon Hasan 👻" <chowonhasan7@gmail.com>', // sender address
        to: `${user}`, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });
      res.send(info);
    });

    // --------------------------------------------

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("boss is running");
});

app.listen(port, () => {
  console.log(`agency portfolio is running on port ${port}`);
});
